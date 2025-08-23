import { Navigation } from "collections";
import { Button, Popup } from "components";
import Image from "next/image";
import React, { RefObject } from "react";
import { clouds, hero1, hero2, stars } from "assets";
import { FadeIn } from "react-slide-fade-in";
import { useAppDispatch, useAppSelector } from "hooks";
import { togglePopup } from "services";

interface LandingPageHeroProps {
  ref?: RefObject<HTMLDivElement>;
}

const buttons: string[] = ["Login", "Sign Up"];

export const LandingPageHero: React.FC<LandingPageHeroProps> = ({
  ...props
}) => {
  const dispatch = useAppDispatch();
  const { popupOpened, userInfo } = useAppSelector((state) => state.counter);

  return (
    <section className="w-full bg-heroBackground overflow-hidden" {...props}>
      <Popup
        closePopup={() => dispatch(togglePopup("null"))}
        popupType={popupOpened || "null"}
      />
      <Image
        src={clouds}
        alt={"cloudsImg"}
        className="animate-clouds left-0 absolute bottom-[80px] scale-[1.7] pointer-events-none"
      />
      <Image
        src={clouds}
        alt={"cloudsImg"}
        className={`left-[-2560px] animate-clouds absolute bottom-[80px] scale-[1.7] pointer-events-none hidden`}
      />
      <Image
        src={stars}
        alt={"stars"}
        className="absolute top-[10%] right-[-50%] animate-starsRight md:right-[-10%]"
      />
      <Image
        src={stars}
        alt={"stars"}
        className="absolute top-[50%] left-[-50%] md:left-[-10%] animate-starsLeft"
      />
      <Image
        src={hero1}
        alt={"hero1Img"}
        className="absolute lg:block bottom-0 lg:-left-[25%] md:-left-[40%] pointer-events-none md:hidden sm:block left-[-10%]"
      />
      <Image
        src={hero2}
        alt={"hero2Img"}
        className="md:absolute bottom-0 -right-[15rem] pointer-events-none md:block hidden"
      />
      <FadeIn
        from="top"
        positionOffset={0}
        triggerOffset={0}
        delayInMilliseconds={400}
        durationInMilliseconds={400}
      >
        <Navigation />
      </FadeIn>
      <FadeIn
        from="top"
        positionOffset={0}
        triggerOffset={0}
        delayInMilliseconds={400}
        durationInMilliseconds={400}
      >
        <div className="hero-container">
        <a class="hero-priv" href="https://joesfaves.com/privacy-banjoshire/"><span class="text-xl">Privacy Policy</span></a>
          <h1 className="hero-banner-text">IMAGINE A PLACE...</h1>
          <p className="hero-p">
            ...where you can belong to a school club, a gaming group, or a
            worldwide art community. Where just you and a handful of friends can
            spend time together. A place that makes it easy to talk every day
            and hang out more often.
          </p>
          <div className="mt-[80px] flex items-center justify-between w-full">
            <div className="text-[20px] flex w-full justify-center">
              {buttons.map((button) => (
                <button
                  className="first:mr-[30px]"
                  onClick={() =>
                    dispatch(
                      togglePopup(button === "Login" ? "login" : "signUp")
                    )
                  }
                  key={button}
                >
                  <Button text={button} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};
