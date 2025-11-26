// Script to populate carousel images in the database
import mongoose from "mongoose";
import axios from "axios";

// Carousel Image Schema (same as in generalServer.mjs)
const carouselImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    alt: { type: String, default: "GTA 6 Header Image" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now },
  },
  { autoIndex: false }
);

const CarouselImage = mongoose.model("CarouselImage", carouselImageSchema);

// Static images data
const staticImages = [
  {
    filename: "Bros.jpg",
    originalName: "Bros.jpg",
    path: "/src/assets/images/HeaderImages/Bros.jpg",
    alt: "GTA 6 Bros Image",
    order: 0,
  },
  {
    filename: "draco.jpg",
    originalName: "draco.jpg",
    path: "/src/assets/images/HeaderImages/draco.jpg",
    alt: "GTA 6 Draco Image",
    order: 1,
  },
  {
    filename: "LuciaPool.jpg",
    originalName: "LuciaPool.jpg",
    path: "/src/assets/images/HeaderImages/LuciaPool.jpg",
    alt: "GTA 6 Lucia Pool Image",
    order: 2,
  },
  {
    filename: "RaulBoat.jpg",
    originalName: "RaulBoat.jpg",
    path: "/src/assets/images/HeaderImages/RaulBoat.jpg",
    alt: "GTA 6 Raul Boat Image",
    order: 3,
  },
  {
    filename: "Stripaz.jpg",
    originalName: "Stripaz.jpg",
    path: "/src/assets/images/HeaderImages/Stripaz.jpg",
    alt: "GTA 6 Stripaz Image",
    order: 4,
  },
];

async function populateCarouselImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.CONNECTION_STRING || "mongodb://localhost:27017/gtafanhub",
      {
        retryWrites: true,
        retryReads: true,
      }
    );

    console.log("Connected to MongoDB");

    // Clear existing carousel images
    await CarouselImage.deleteMany({});
    console.log("Cleared existing carousel images");

    // Insert static images
    const insertedImages = await CarouselImage.insertMany(staticImages);
    console.log(`Inserted ${insertedImages.length} carousel images:`);

    insertedImages.forEach((img) => {
      console.log(`- ${img.filename} (${img.alt})`);
    });

    console.log("Carousel images populated successfully!");
  } catch (error) {
    console.error("Error populating carousel images:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
populateCarouselImages();
