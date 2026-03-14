package com.auxera;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class AuxeraApplication {

	public static void main(String[] args) {

		Dotenv dotenv = Dotenv.load();

		System.setProperty("DB_URL", dotenv.get("DB_URL"));
		System.setProperty("DB_USERNAME", dotenv.get("DB_USERNAME"));
		System.setProperty("DB_PASSWORD", dotenv.get("DB_PASSWORD"));
		System.setProperty("BREVO_API_KEY", dotenv.get("BREVO_API_KEY"));
		System.setProperty("USER_MAIL", dotenv.get("USER_MAIL"));

		SpringApplication.run(AuxeraApplication.class, args);
	}
}