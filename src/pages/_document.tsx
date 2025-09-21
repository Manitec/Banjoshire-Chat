import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <>
      <Html lang="en">
        <Head>
          <link rel="manifest" href="manifest.json" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Lilita+One&display=swap"
            rel="stylesheet"
          ></link>
            
        </Head>
        <body>
          <script>
             if (typeof navigator.serviceWorker !== 'undefined') {
             navigator.serviceWorker.register('sw.js')
             }
           </script>

          <Main />
          <NextScript />
          </body>
      </Html>
    </>
  );
}
