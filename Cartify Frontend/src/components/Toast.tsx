// Even more aggressive z-index version
export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onRemove }) => {
  // ... rest of the code remains the same ...

  return (
    // Create a new stacking context with maximum z-index
    <div 
      className={styles.wrapper} 
      style={{ 
        zIndex: 2147483647, // Maximum 32-bit integer value
        isolation: 'isolate' // Creates a new stacking context
      }}
    >
      <div className={styles.inner}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              {...animationProps}
              className={`
                ${styles.message}
                ${styles.spacing}
                flex items-center
                ${msg.type === 'success' 
                  ? 'bg-green-600 dark:bg-green-700' 
                  : 'bg-blue-600 dark:bg-blue-700'
                }
                text-white
                shadow-2xl
                mb-2
                cursor-pointer
                active:scale-95 transition-transform
              `}
              onClick={() => onRemove(msg.id)}
              style={{ 
                position: 'relative', 
                zIndex: 2147483647
              }}
            >
              {/* ... rest of the toast content ... */}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
