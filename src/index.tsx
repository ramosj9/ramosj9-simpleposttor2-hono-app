import { Hono } from 'hono';
import { COMPOSED_HANDLER } from 'hono/hono-base';

//This is where the each individual page is been loated to keep structure to my site been built. 
import homepage from './home/index.html';
import images from './images/images.html';
import successUpload from './images/errors/success.html';
import errorUpload from './images/errors/error.html';


export type bindings = {
  // [key in keyof CloudflareBindings]: CloudflareBindings[key]; //This automaticall pulls the bindings from cloudflare toml file and 
  DB: D1Database // D1 Binding
  IMAGES: R2Bucket // R2 Binding
  MY_VARIABLE: string // Variables from workers.toml
  PRIVATE: string // secret variables from .dev.vars. # hide username and password or API keys not visible to anyone. 
}

const app = new Hono<{ Bindings: bindings}>()
// Style to apply to the entire site. 
app.get('/styles.css', (c) => {
  const cssStyle = `
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      
      /* Add a Orange background color to the top navigation */
      .topnav {
      position: relative;
      background-color: #f39e30;
      overflow: hidden;
      }
      /* Style the links inside the navigation bar */
      .topnav a {
      float: left;
      color: #f2f2f2,
      text-align: center;
      padding: 10px 12px;
      text-decoration: none;
      font-size: 20px;
      }
      /* Change the color of links on hover */
      .topnav a:hover {
      background-color: #ddd;
      color: black;
      }

      .logo-left img {
      height: 33px; 
      width: auto;
      position: absolute;
      top: 20%;
      left: 0%%;
      }
      
      /* Centered section inside the top navigation */
      .topnav-centered a {
      float: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      }

      /* Right-aligned section inside the top navigation */
      .topnav-right {
      float: right;
      color: #f2f2f2
    }`;
  return c.text(cssStyle, 200, {'Content-Type': 'text/css'});
});

app.get('/Cloudflare-White.png', async (c) => {
  const image = await c.env.IMAGES.get('Cloudflare-White.png'); // Adjust this line based on where your image is stored

  if (image) {
    return new Response(image.body, {
      headers: { 'Content-Type': 'image/png' },
    });
  } else {
    return c.text('Not Found', 404);
  }
});

// Return my hompage
app.get('/', (c) => {
  if (homepage) {
    return c.html(homepage, 200);
  } else {
    return c.text('Page not found!', 400);
  }
});
//retunr our image page
app.get("/images", async (c)  => {
  try {
    const listOFiles = await c.env.IMAGES.list();
    if (listOFiles.objects.length > 0) {
      // Display the names of the files in the images.html page. 
      const imagesListItems = listOFiles.objects.map((file) => `<li>${file.key}</li>`).join('');
      //Options for the drop down
      const imageOptions = listOFiles.objects.map((image) => `<option value="${image.key}">${image.key}</option>`).join('');
      //console.log(imageOptions) //Console: See what the options
      
      const modifiedHtml = images
        .replace("{{imagesList}}", imagesListItems)
        .replace("{{imageOptions}}", imageOptions);
        //console.log(modifiedHtml) // Show me the html in console to see what I'm getting back.
      return c.html(modifiedHtml, 200);
    } else {
      const modifiedHtml = images
        .replace("{{imagesList}}", "<li>No images found</li>")
        .replace("{{imageOptions}}", "<option>No images available</option>");
      return c.text('Page not found!', 404);
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    return c.text('Internal Server Error', 500);
  }
});

//Handle an image upload
app.post("/images/upload", async (c) => { 
    const body = await c.req.parseBody();
    const uploadFile = body["filename"]; 
    //const key = c.req.param('key')
    if (uploadFile && uploadFile instanceof File) { // make sure this is an instance of a file
      const key = uploadFile.name; //Use the filename as key for upload
      console.log("Uploading file to R2") // for troubleshooting. 
      console.log(body["filename"]); // show me the content of the file in console been uploaded. 
      await c.env.IMAGES.put(key, uploadFile);
      // Handle the succes and error on the upload
      const successHtml = successUpload;
      const errorHtml = errorUpload
      return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html' } }); 
    } else {
      return new Response(errorUpload, { status: 403, headers: { 'Content-Type': 'text/html' } });
    }
        
    //console.log(body["filename"]); // file been uploaded. 
});

app.post('/images/delete', async (c) => {
  try {
    const formData = await c.req.parseBody();
    console.log (formData)
    const imageKey = formData['image'];
    console.log(imageKey)
    if (imageKey) {
      await c.env.IMAGES.delete(imageKey);
      return c.redirect('/images');
    } else {
      return c.text('No file selected', 400);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return c.text('Internal Server Error', 500);
  }
});

export default app;