import React from "react";
import Logo from "../common/Logo";

export default function LoginVisual() {
  return (
    <div className="login-visual">
      <div className="visual-grid" />
      <Logo />
      <div className="login-visual-copy">
        <span>QUALITY BY DESIGN</span>
        <h1>Make every QMS record traceable.</h1>
        <p>
          Digitize document control, task workflows and review activity
          without disrupting the established quality system.
        </p>
      </div>
      <small>Centre for Development of Advanced Computing</small>
    </div>
  );
}
