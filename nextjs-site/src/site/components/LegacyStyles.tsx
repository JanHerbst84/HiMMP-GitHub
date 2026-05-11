import type { LegacyStyle } from "@/src/site/legacy-content";

type LegacyStylesProps = {
  styles: LegacyStyle[];
};

export function LegacyStyles({ styles }: LegacyStylesProps) {
  return (
    <>
      {styles.map((style, index) => (
        <style key={`legacy-style-${index}`} dangerouslySetInnerHTML={{ __html: style.content }} />
      ))}
    </>
  );
}
