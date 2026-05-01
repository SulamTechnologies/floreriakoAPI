export default function RootPage() {
  return (
    <html lang="es">
      <head>
        <title>Floreria KO — API</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #0a0a0a;
            color: #e5e5e5;
            font-family: ui-monospace, "Cascadia Code", "Source Code Pro", monospace;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .card {
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 2.5rem 3rem;
            max-width: 480px;
            width: 100%;
            background: #111;
          }
          .badge {
            display: inline-block;
            background: #166534;
            color: #bbf7d0;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            padding: 3px 10px;
            border-radius: 999px;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
          }
          h1 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #fafafa;
            margin-bottom: 0.5rem;
            font-family: ui-sans-serif, system-ui, sans-serif;
          }
          p {
            font-size: 0.8rem;
            color: #737373;
            margin-bottom: 2rem;
            font-family: ui-sans-serif, system-ui, sans-serif;
            line-height: 1.6;
          }
          .endpoints {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .endpoint {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.78rem;
          }
          .method {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 4px;
            min-width: 44px;
            text-align: center;
            letter-spacing: 0.04em;
          }
          .get  { background: #1e3a5f; color: #93c5fd; }
          .post { background: #1a3328; color: #6ee7b7; }
          .patch { background: #2d2008; color: #fcd34d; }
          .del  { background: #3b0f0f; color: #fca5a5; }
          .path { color: #a3a3a3; }
          .divider {
            border: none;
            border-top: 1px solid #1f1f1f;
            margin: 1.75rem 0;
          }
          .footer {
            font-size: 0.7rem;
            color: #404040;
            font-family: ui-sans-serif, system-ui, sans-serif;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <span className="badge">REST API</span>
          <h1>Floreria KO — API</h1>
          <p>
            Backend de comercio electronico. Todos los endpoints se encuentran bajo el prefijo{" "}
            <code style={{ color: "#a3a3a3" }}>/api</code>.
          </p>

          <ul className="endpoints">
            <li className="endpoint">
              <span className="method get">GET</span>
              <span className="path">/api/health</span>
            </li>
            <li className="endpoint">
              <span className="method get">GET</span>
              <span className="path">/api/products</span>
            </li>
            <li className="endpoint">
              <span className="method get">GET</span>
              <span className="path">/api/products/:slug</span>
            </li>
            <li className="endpoint">
              <span className="method get">GET</span>
              <span className="path">/api/cart</span>
            </li>
            <li className="endpoint">
              <span className="method post">POST</span>
              <span className="path">/api/cart</span>
            </li>
            <li className="endpoint">
              <span className="method patch">PATCH</span>
              <span className="path">/api/cart/items/:id</span>
            </li>
            <li className="endpoint">
              <span className="method del">DELETE</span>
              <span className="path">/api/cart/items/:id</span>
            </li>
            <li className="endpoint">
              <span className="method post">POST</span>
              <span className="path">/api/cart/merge</span>
            </li>
          </ul>

          <hr className="divider" />
          <p className="footer">Sulam Technologies · {new Date().getFullYear()}</p>
        </div>
      </body>
    </html>
  );
}
