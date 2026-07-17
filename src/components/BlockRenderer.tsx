import React from 'react';

import {CardGridBlock} from './blocks/CardGridBlock';
import {CarouselBlock} from './blocks/CarouselBlock';
import {CTABlock, ImageBlock, TextBlock} from './blocks/ContentBlocks';
import {HeroBlock} from './blocks/HeroBlock';
import {PromoRailBlock} from './blocks/PromoRailBlock';
import {SharedArchiveBlock, SharedContentBlock, SharedCTABlock, SharedFormBlock, SharedMediaBlock} from './blocks/SharedBlocks';
import type {BlockOf, ContentBlock} from '../types/content';

export const BlockRenderer = ({block, onNavigate}: {block: ContentBlock; onNavigate: (path: string) => void}) => {
  switch (block.blockType) {
    case 'restaurantHero': return <HeroBlock block={block as BlockOf<'restaurantHero'>} onNavigate={onNavigate} />;
    case 'cardGrid': return <CardGridBlock block={block as BlockOf<'cardGrid'>} />;
    case 'carousel': return <CarouselBlock block={block as BlockOf<'carousel'>} />;
    case 'promoRail': return <PromoRailBlock block={block as BlockOf<'promoRail'>} onNavigate={onNavigate} />;
    case 'textBlock': return <TextBlock block={block as BlockOf<'textBlock'>} />;
    case 'imageBlock': return <ImageBlock block={block as BlockOf<'imageBlock'>} />;
    case 'restaurantCTA': return <CTABlock block={block as BlockOf<'restaurantCTA'>} onNavigate={onNavigate} />;
    case 'cta': return <SharedCTABlock block={block as BlockOf<'cta'>} onNavigate={onNavigate} />;
    case 'content': return <SharedContentBlock block={block as BlockOf<'content'>} onNavigate={onNavigate} />;
    case 'mediaBlock': return <SharedMediaBlock block={block as BlockOf<'mediaBlock'>} onNavigate={onNavigate} />;
    case 'archive': return <SharedArchiveBlock block={block as BlockOf<'archive'>} onNavigate={onNavigate} />;
    case 'formBlock': return <SharedFormBlock block={block as BlockOf<'formBlock'>} onNavigate={onNavigate} />;
    default:
      if (__DEV__) console.warn(`Unsupported CMS block: ${block.blockType}`);
      return null;
  }
};
