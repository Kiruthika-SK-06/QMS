import React from "react";

export default function PageIntro({ title, action }) {
  return (
    <div className="page-intro">
      <div>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}
