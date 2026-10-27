export type SlotState = "free" | "taken" | "empty";

export type SlotRow = {
  label: string;
  blocks: ReadonlyArray<{
    span: number;
    state: SlotState;
  }>;
};

export function SlotStrip({
  rows,
  variant,
  description,
  isLive = false,
}: {
  rows: ReadonlyArray<SlotRow>;
  variant: "board" | "divider" | "loader";
  description: string;
  isLive?: boolean;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`slot-strip slot-strip--${variant}${isLive ? " slot-strip-live" : ""}`}
      >
        {rows.map((row, rowIndex) => (
          <div className="slot-row" key={`${row.label}-${rowIndex}`}>
            {variant === "board" ? <span className="slot-day">{row.label}</span> : null}
            <div className="slot-track">
              {row.blocks.map((block, blockIndex) => (
                <span
                  className={`slot-block slot-block--${block.state}`}
                  key={`${rowIndex}-${blockIndex}`}
                  style={
                    {
                      gridColumn: `span ${block.span}`,
                      animationDelay: `${blockIndex * 60}ms`,
                    }
                  }
                >
                  {block.state === "taken" ? (
                    <svg className="slot-check" viewBox="0 0 16 16" fill="none">
                      <path d="m3 8 3.2 3.2L13 4.8" />
                    </svg>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">{description}</span>
    </>
  );
}
