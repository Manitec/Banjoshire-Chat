import { Loader } from "components";
import dynamic from "next/dynamic";

const LandingPageHero = dynamic(() =>
  import("sections").then((el) => el.LandingPageHero)
);

export default function Home() {
  return (
    <>
      <LandingPageHero />
      <script>
    navigator.serviceWorker.register(public/sw.js)
   </script>
   </>
  );
}
