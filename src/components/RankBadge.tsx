import React from 'react';
import { RANKS, rankIdx } from '../constants/data';

interface RankBadgeProps {
  pts?: number;
  big?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ pts = 0, big = false }) => {
  const i = rankIdx(pts);
  const r = RANKS[i];

  return (
    <span className={`rank r-${r.id} ${big ? 'lg' : ''}`} title={r.name}>
      <span className="rt">{r.name}</span>
    </span>
  );
};
