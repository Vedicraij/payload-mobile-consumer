export const CONTENT_CONTRACT_VERSION = '1.1' as const;

export type PlatformChannel = 'ios' | 'android';

export type RichTextNode = {
  children?: RichTextNode[];
  text?: string;
  type?: string;
  [key: string]: unknown;
};

export type RichText = {
  root?: RichTextNode;
  [key: string]: unknown;
};

export type Media = {
  alt?: string | null;
  height?: number | null;
  id: string;
  mimeType?: string | null;
  url?: string | null;
  width?: number | null;
};

export type Destination = {
  key?: string;
  label?: string;
  path: string;
  supportedPlatforms?: string[];
};

export type CMSLink = {
  appearance?: 'default' | 'outline' | null;
  label: string;
  newTab?: boolean | null;
  reference?: {
    relationTo: 'pages' | 'posts';
    value: string | {slug?: string | null; title?: string | null};
  } | null;
  type?: 'reference' | 'custom' | null;
  url?: string | null;
};

export type Promotion = {
  cta?: {destination?: Destination | null; label?: string};
  description: string;
  desktopImage?: Media;
  eyebrow?: string;
  id: string;
  mobileImage?: Media;
  title: string;
};

type BlockBase<T extends string> = {
  blockType: T;
  contractVersion?: typeof CONTENT_CONTRACT_VERSION;
  id?: string | null;
};

export type RestaurantHeroBlock = BlockBase<'restaurantHero'> & {
  actions?: Array<{destination?: Destination | null; href?: string | null; label: string}>;
  description?: string;
  eyebrow?: string;
  headline?: string;
  image?: Media;
  mobileImage?: Media;
};

export type CardGridBlock = BlockBase<'cardGrid'> & {
  cards?: Array<{
    description: string;
    image?: Media;
    price?: string;
    title: string;
  }>;
  eyebrow?: string;
  title?: string;
};

export type CarouselBlock = BlockBase<'carousel'> & {
  slides?: Array<{description?: string; image?: Media; title: string}>;
  title?: string;
};

export type PromoRailBlock = BlockBase<'promoRail'> & {
  promotions?: Promotion[];
  title?: string;
};

export type RestaurantTextBlock = BlockBase<'textBlock'> & {
  alignment?: 'center' | 'left';
  body?: string;
  eyebrow?: string;
  heading?: string;
};

export type RestaurantImageBlock = BlockBase<'imageBlock'> & {
  caption?: string;
  image?: Media;
  mobileImage?: Media;
};

export type RestaurantCTABlock = BlockBase<'restaurantCTA'> & {
  description?: string;
  destination?: Destination | null;
  headline?: string;
  href?: string | null;
  label?: string;
  tone?: string;
};

export type CallToActionBlock = BlockBase<'cta'> & {
  links?: Array<{id?: string | null; link: CMSLink}> | null;
  richText?: RichText | null;
};

export type StandardContentBlock = BlockBase<'content'> & {
  columns?: Array<{
    enableLink?: boolean | null;
    id?: string | null;
    link?: CMSLink;
    richText?: RichText | null;
    size?: 'oneThird' | 'half' | 'twoThirds' | 'full' | null;
  }> | null;
};

export type MediaBlock = BlockBase<'mediaBlock'> & {
  media: Media | string;
};

export type ArchiveItem = {
  excerpt?: string | null;
  id?: string;
  meta?: {description?: string | null};
  slug?: string | null;
  title?: string | null;
};

export type ArchiveBlock = BlockBase<'archive'> & {
  docs?: ArchiveItem[];
  introContent?: RichText | null;
  items?: ArchiveItem[];
  selectedDocs?: Array<{
    relationTo: 'posts';
    value: ArchiveItem | string;
  }> | null;
};

type InputFormField = {
  blockType: 'country' | 'email' | 'number' | 'state' | 'text' | 'textarea';
  defaultValue?: number | string | null;
  label?: string | null;
  name: string;
  placeholder?: string | null;
  required?: boolean | null;
};

export type FormField = InputFormField | {
  blockType: 'checkbox';
  defaultValue?: boolean | null;
  label?: string | null;
  name: string;
  required?: boolean | null;
} | {
  blockType: 'select';
  defaultValue?: string | null;
  label?: string | null;
  name: string;
  options?: Array<{label: string; value: string}> | null;
  placeholder?: string | null;
  required?: boolean | null;
} | {
  blockType: 'message';
  message?: RichText | null;
};

export type Form = {
  confirmationMessage?: RichText | null;
  confirmationType?: 'message' | 'redirect' | null;
  fields?: FormField[] | null;
  id: string;
  redirect?: {url: string} | null;
  submitButtonLabel?: string | null;
  title: string;
};

export type FormBlock = BlockBase<'formBlock'> & {
  enableIntro?: boolean | null;
  form: Form | string;
  introContent?: RichText | null;
};

export type KnownContentBlock =
  | RestaurantHeroBlock
  | CardGridBlock
  | CarouselBlock
  | PromoRailBlock
  | RestaurantTextBlock
  | RestaurantImageBlock
  | RestaurantCTABlock
  | CallToActionBlock
  | StandardContentBlock
  | MediaBlock
  | ArchiveBlock
  | FormBlock;

export type UnknownContentBlock = BlockBase<string> & Record<string, unknown>;
export type ContentBlock = KnownContentBlock | UnknownContentBlock;
export type BlockOf<T extends KnownContentBlock['blockType']> = Extract<KnownContentBlock, {blockType: T}>;

export type CMSPage = {
  id: string;
  layout: ContentBlock[];
  slug: string;
  title: string;
  updatedAt: string;
};

export type NavigationItem = {
  destination: Destination;
  highlighted?: boolean;
  icon?: string;
  label: string;
};

export type OperationalControls = {
  appUpdate?: {
    androidStoreUrl?: string;
    iosStoreUrl?: string;
    message?: string;
    minimumVersion?: string;
    policy?: 'none' | 'recommended' | 'required';
    recommendedVersion?: string;
  };
  bannerMessage?: string;
  maintenanceMessage?: string;
  mode?: 'maintenance' | 'normal' | 'notice';
};

export type Bootstrap = {
  experience?: {
    labels?: Array<{key: string; value: string}>;
    visibleModules?: string[];
  };
  featureFlags: Record<string, boolean>;
  navigation?: {items?: NavigationItem[]};
  operationalControls?: OperationalControls;
  promotions: Promotion[];
};

export type LegalContent = {
  content?: unknown;
  legalVersion?: string;
  summary?: string;
  title: string;
};

export type APIEnvelope<T> = {
  contractVersion: typeof CONTENT_CONTRACT_VERSION;
  data: T;
  nextChangeAt?: string;
  resolvedContext?: Record<string, unknown>;
};
