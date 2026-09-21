import { observer } from "mobx-react";
import { useAppHeaderController } from "./AppHeader.controller";

export const AppHeaderView = observer(() => {
  const vm = useAppHeaderController();

  return (
    <header className="header">
      <h1 className="header__title">{vm.title}</h1>
      <span className="header__counter">{vm.counterText}</span>
    </header>
  );
});
