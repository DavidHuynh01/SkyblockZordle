import { useState } from "react";
import Menu from "./components/Menu.jsx";
import Game from "./components/Game.jsx";
import Collections from "./components/Collections.jsx";
import Background from "./components/Background.jsx";

// Tiny in-memory router. Screens: "menu" | "daily" | "unlimited" | "collections"
export default function App() {
  const [screen, setScreen] = useState("menu");

  let view;
  if (screen === "menu") view = <Menu onNavigate={setScreen} />;
  else if (screen === "collections")
    view = <Collections onBack={() => setScreen("menu")} />;
  else
    view = (
      <Game
        key={screen}
        mode={screen === "daily" ? "daily" : "unlimited"}
        onBack={() => setScreen("menu")}
      />
    );

  return (
    <>
      <Background />
      {view}
    </>
  );
}
