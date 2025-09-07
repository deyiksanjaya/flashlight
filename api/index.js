import fs from 'fs/promises';
import path from 'path';

// This function will run on Vercel's servers, not in the browser.
export default async function handler(request, response) {
  try {
    // 1. Define the path to your HTML template.
    // process.cwd() gives the root directory of your project on Vercel.
    const templatePath = path.join(process.cwd(), 'control', 'app.html');

    // 2. Read the HTML template file.
    let templateContent = await fs.readFile(templatePath, 'utf8');

    // 3. Replace each placeholder with the corresponding environment variable.
    // These variables are securely stored in your Vercel project settings.
    templateContent = templateContent.replace(/%VITE_FIREBASE_API_KEY%/g, process.env.VITE_FIREBASE_API_KEY);
    templateContent = templateContent.replace(/%VITE_FIREBASE_AUTH_DOMAIN%/g, process.env.VITE_FIREBASE_AUTH_DOMAIN);
    templateContent = templateContent.replace(/%VITE_FIREBASE_PROJECT_ID%/g, process.env.VITE_FIREBASE_PROJECT_ID);
    templateContent = templateContent.replace(/%VITE_FIREBASE_STORAGE_BUCKET%/g, process.env.VITE_FIREBASE_STORAGE_BUCKET);
    templateContent = templateContent.replace(/%VITE_FIREBASE_MESSAGING_SENDER_ID%/g, process.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
    templateContent = templateContent.replace(/%VITE_FIREBASE_APP_ID%/g, process.env.VITE_FIREBASE_APP_ID);

    // 4. Send the fully rendered HTML to the user's browser.
    response.setHeader('Content-Type', 'text/html');
    response.status(200).send(templateContent);

  } catch (error) {
    console.error('Error processing template:', error);
    response.status(500).send('An error occurred while loading the application.');
  }
}
