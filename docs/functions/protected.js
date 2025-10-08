export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const pass = url.searchParams.get("p");
  
    // Check password
    if (pass !== env.PAGE_PASSWORD) {
      return new Response(
        `<!DOCTYPE html><html><body>
         <form action="/test">
           <input type="password" name="p" placeholder="Password">
           <button>Enter</button>
         </form>
         </body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
  
    // Serve your protected HTML file
    const file = await context.env.ASSETS.fetch("https://tips.you.ge/tip");
    return new Response(await file.text(), { headers: { "Content-Type": "text/html" } });
  }