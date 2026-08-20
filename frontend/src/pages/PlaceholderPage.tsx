import React from 'react';
import { motion } from 'motion/react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="p-12 rounded-xl bg-card/60 border border-border/50 border-dashed text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
          LH
        </div>
        <p className="text-sm font-medium text-foreground">{title} Module</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          This section is scaffolded in CHUNK 01 and will be fully wired up in upcoming dedicated chunks.
        </p>
      </div>
    </motion.div>
  );
};
