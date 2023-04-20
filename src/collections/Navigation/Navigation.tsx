import { Button, Logo, Popup } from "components";
import { useAppDispatch, useAppSelector } from "hooks";
import React, { RefObject } from "react";
import { togglePopup } from "services";

interface NavigationProps {
  ref?: RefObject<HTMLButtonElement>;
}

export const Navigation: React.FC<NavigationProps> = ({ ...props }) => {
  const dispatch = useAppDispatch();
  const { popupOpened } = useAppSelector((state) => state.counter);
  return (
    <nav className="navigation-landing" {...props}>
      <Logo />
      <Popup
        closePopup={() => togglePopup("null")}
        popupType={popupOpened || "null"}
      />
    </nav>
  );
};
