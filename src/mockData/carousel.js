// Mock carousel data for demo
export const mockCarouselImages = [
  {
    _id: "carousel1",
    url: "/src/assets/images/HeaderImages/Bros.jpg",
    title: "GTA 6 Characters",
    description: "Meet the cast of GTA 6",
    order: 1,
  },
  {
    _id: "carousel2",
    url: "/src/assets/images/HeaderImages/draco.jpg",
    title: "Vice City",
    description: "Explore the vibrant city",
    order: 2,
  },
  {
    _id: "carousel3",
    url: "/src/assets/images/HeaderImages/LuciaPool.jpg",
    title: "Lucia",
    description: "One of the main protagonists",
    order: 3,
  },
  {
    _id: "carousel4",
    url: "/src/assets/images/HeaderImages/RaulBoat.jpg",
    title: "Adventure Awaits",
    description: "Discover new locations",
    order: 4,
  },
  {
    _id: "carousel5",
    url: "/src/assets/images/HeaderImages/Stripaz.jpg",
    title: "Vice City Life",
    description: "Experience the city",
    order: 5,
  },
];

// Helper to get carousel images
export function getCarouselImages() {
  return {
    images: mockCarouselImages.map((img) => img.url),
  };
}

