export interface SocialPost {
  id: string;
  user: {
    name: string;
    handle: string;
    avatar: string;
  };
  location: string;
  images: string[];
  caption: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
}
