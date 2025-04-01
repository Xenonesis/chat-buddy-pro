import React from 'react';
import { useBreakpoint } from '../utils/responsive';
import styles from '../styles/ResponsiveGrid.module.css';

type ResponsiveColumns = {
  xs?: number;  // Extra small screens (up to 480px)
  sm?: number;  // Small screens (480px to 640px)
  md?: number;  // Medium screens (640px to 768px)
  lg?: number;  // Large screens (768px to 1024px)
  xl?: number;  // Extra large screens (1024px to 1280px)
  xxl?: number; // Very large screens (1280px and above)
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: ResponsiveColumns | number;
  gap?: string | number;
  rowGap?: string | number;
  columnGap?: string | number;
  className?: string;
  itemClassName?: string;
  autoRows?: string;
  minItemWidth?: string;
  maxItemWidth?: string;
  center?: boolean;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 },
  gap = '1rem',
  rowGap,
  columnGap,
  className = '',
  itemClassName = '',
  autoRows,
  minItemWidth,
  maxItemWidth,
  center = false
}) => {
  const { isXs, isSm, isMd, isLg, isXl } = useBreakpoint();

  // Determine number of columns based on current breakpoint
  let columnsCount: number;

  if (typeof columns === 'number') {
    columnsCount = columns;
  } else {
    if (isXs && columns.xs !== undefined) {
      columnsCount = columns.xs;
    } else if (isSm && columns.sm !== undefined) {
      columnsCount = columns.sm;
    } else if (isMd && columns.md !== undefined) {
      columnsCount = columns.md;
    } else if (isLg && columns.lg !== undefined) {
      columnsCount = columns.lg;
    } else if (isXl && columns.xl !== undefined) {
      columnsCount = columns.xl;
    } else {
      // Default to xxl or fallback to 1
      columnsCount = columns.xxl || 1;
    }
  }

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: minItemWidth 
      ? `repeat(auto-fill, minmax(${minItemWidth}, 1fr))` 
      : `repeat(${columnsCount}, 1fr)`,
    gap: gap,
    rowGap: rowGap,
    columnGap: columnGap,
    justifyContent: center ? 'center' : 'initial',
    alignItems: center ? 'center' : 'initial',
  };

  if (autoRows) {
    gridStyles.gridAutoRows = autoRows;
  }

  // Convert children to array for mapping
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={`${styles.responsiveGrid} ${className}`} style={gridStyles}>
      {childrenArray.map((child, index) => (
        <div 
          key={index} 
          className={`${styles.gridItem} ${itemClassName}`}
          style={{ maxWidth: maxItemWidth }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default ResponsiveGrid;
