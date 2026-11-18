export const PUBLIC_IMAGES = {
  LOGO: "/images/ka1dyn_logo.png",
  DOG: "/images/happy_dog.webp",
  BIKE: "/images/bike_rain.webp",
  CITY: "/images/city_rain.webp",
  DOG_THUMBNAIL: "images/happy_dog_thumbnail.jpg",
  BIKE_THUMBNAIL: "images/bike_rain_thumbnail.jpg",
  CITY_THUMBNAIL: "/images/city_rain_thumbnail.jpg",
  FOLDER: "/images/folder.png",
  CLOUD: "/images/cloud.png",
  PROJECT_WORKSPACE_THUMBNAIL: "/content/images/workspace_thumbnail.png",
  PROJECT_DEVLIBRARY_THUMBNAIL: "/content/images/dev_libary.jpg",
  PROJECT_ECODE_THUMBNAIL: "/content/images/ecode.png",
} as const;

export type PUBLIC_IMAGES = typeof PUBLIC_IMAGES;
