'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Typewriter({ words, className }: { words: string[], className?: string }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'deleting'>('typing');

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (phase === 'typing') {
      if (currentText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        }, 200);
      } else {
        timeout = setTimeout(() => setPhase('deleting'), 1500);
      }
    } else if (currentText.length > 0) {
      timeout = setTimeout(() => {
        setCurrentText(currentWord.slice(0, currentText.length - 1));
      }, 100);
    } else {
      setPhase('typing');
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => {
      if (timeout !== undefined) clearTimeout(timeout);
    };
  }, [currentText, phase, currentWordIndex, words]);

  return (
    <div className={`${className} leading-relaxed`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre-wrap break-words text-balance relative"
      >
        {currentText}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="inline-block h-[1em] w-[2px] bg-current align-middle ml-0.5"
        />
      </motion.div>
    </div>
  );
}
