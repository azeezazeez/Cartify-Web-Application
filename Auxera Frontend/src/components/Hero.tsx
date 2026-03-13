import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const CAROUSEL_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop',
    title: 'Golden Excellence',
    subtitle: 'Luxurious.',
    description: 'Discover our curated selection of premium essentials designed for the modern individual.'
  },
  {
    url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&auto=format&fit=crop',
    title: 'Timeless Style',
    subtitle: 'Elevated.',
    description: 'Explore our new season arrivals featuring sustainable materials and classic silhouettes.'
  },
  {
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop',
    title: 'MacBook Pro',
    subtitle: 'Excellence.',
    description: 'Every piece is a testament to our commitment to quality and attention to detail.'
  }
];

export const Hero: React.FC<{ 
  showToast: (text: string) => void;
  onLookbookClick: () => void;
  onShopClick: () => void;
}> = ({ showToast, onLookbookClick, onShopClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  }, []);

  const slidePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(slideNext, 6000);
    return () => clearInterval(timer);
  }, [slideNext]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-brand-950">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "tween", duration: 0.6, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 z-0">
            <img
              src={CAROUSEL_IMAGES[currentIndex].url}
              alt={CAROUSEL_IMAGES[currentIndex].title}
              className="w-full h-full object-cover opacity-60 dark:opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-950/40 via-transparent to-brand-950" />
          </div>

          <div className="relative z-10 h-full flex items-center justify-center px-6 text-center">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase mb-6 text-brand-300">
                  New Collection 2026
                </span>
                <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-8 leading-[0.9] text-white">
                  {CAROUSEL_IMAGES[currentIndex].title} <br />
                  <span className="italic font-normal text-brand-300">
                    {CAROUSEL_IMAGES[currentIndex].subtitle}
                  </span>
                </h1>
                <p className="max-w-xl mx-auto text-lg text-brand-100 mb-10 leading-relaxed opacity-80">
                  {CAROUSEL_IMAGES[currentIndex].description}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={onShopClick}
                    className="group px-8 py-4 bg-white text-brand-950 rounded-full font-bold flex items-center space-x-2 hover:bg-brand-100 transition-all duration-300"
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={onLookbookClick}
                    className="px-8 py-4 bg-transparent text-white border border-white/30 rounded-full font-bold hover:bg-white/10 transition-all duration-300"
                  >
                    View Lookbook
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 px-6 flex justify-between pointer-events-none">
        <button
          onClick={slidePrev}
          className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={slideNext}
          className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white w-8' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
