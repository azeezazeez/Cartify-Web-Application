package com.cartify.backend.config;

import com.cartify.backend.service.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    // List of public paths that don't require authentication
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/forgot-password/generate-otp",
            "/api/auth/forgot-password/verify-otp",
            "/api/auth/forgot-password/reset-password",
            "/api/products",
            "/api/public",
            "/api/debug",
            "/h2-console"
    );

    private boolean isPublicPath(String path) {
        if (path == null || path.isEmpty()) {
            return false;
        }
        
        for (String publicPath : PUBLIC_PATHS) {
            if (path.startsWith(publicPath)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Get the request path - using RequestURI which includes the full path
        String requestURI = request.getRequestURI();
        String servletPath = request.getServletPath();
        
        // Enhanced debug logging
        System.out.println("=== JWT FILTER DEBUG ===");
        System.out.println("RequestURI: '" + requestURI + "'");
        System.out.println("ServletPath: '" + servletPath + "'");
        System.out.println("ContextPath: '" + request.getContextPath() + "'");
        System.out.println("Method: " + request.getMethod());
        System.out.println("Auth Header present: " + (authHeader != null));

        // PUBLIC ENDPOINTS - Skip JWT validation completely
        // Check against both RequestURI and ServletPath
        if (isPublicPath(requestURI) || isPublicPath(servletPath)) {
            System.out.println("✅ Public path - skipping authentication");
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println("🔒 Protected path - authentication required");
        
        // For all other endpoints, require valid JWT token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("❌ No valid auth header for path: " + requestURI);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Missing or invalid Authorization header\"}");
            return;
        }

        jwt = authHeader.substring(7);
        System.out.println("Token received: " + jwt.substring(0, Math.min(50, jwt.length())) + "...");

        try {
            userEmail = jwtUtil.extractEmail(jwt);
            System.out.println("Extracted email: " + userEmail);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                System.out.println("UserDetails authorities: " + userDetails.getAuthorities());

                if (jwtUtil.validateToken(jwt, userEmail)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    System.out.println("✅ Authenticated user: " + userEmail);
                } else {
                    System.out.println("❌ Token validation failed");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Invalid token\"}");
                    return;
                }
            }
        } catch (ExpiredJwtException e) {
            System.out.println("❌ Token expired for: " + e.getClaims().getSubject());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Token expired\"}");
            return;
        } catch (MalformedJwtException | SignatureException e) {
            System.out.println("❌ Invalid token: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid token\"}");
            return;
        } catch (Exception e) {
            System.out.println("❌ Auth error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Authentication failed: " + e.getMessage() + "\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
