
import "dotenv/config";
import app from "./src/app.js"
import connectDB from "./src/db/index.db.js";




connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

