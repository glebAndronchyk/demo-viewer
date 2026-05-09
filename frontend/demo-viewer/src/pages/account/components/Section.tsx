import { Divider } from "antd";
import type { ReactNode } from "react";

interface SectionProps {
  first?: boolean;
  children: ReactNode;
  title: ReactNode;
}

export const Section = (props: SectionProps) => {
  const { first = false, title, children } = props;

  return (
    <>
      {!first && <Divider />}
      <h3 className="mb-4">{title}</h3>
      {children}
    </>
  );
};
