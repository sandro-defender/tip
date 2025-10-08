export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const password = url.searchParams.get("p");

  // Check password
  if (password !== env.PAGE_PASSWORD) {
    return new Response(
      `<!DOCTYPE html><html><body>
       <h3>Password required</h3>
       <form action="/protected">
         <input type="password" name="p" placeholder="Password">
         <button type="submit">Enter</button>
       </form>
       </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // ✅ If password matches, serve secret.html
  const response = await env.ASSETS.fetch("https://tips.you.ge/html/bar/html");
  return new Response(await response.text(), {
    headers: { "Content-Type": "text/html" }
  });
}