import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { PayBand } from './PayBand';

const band = { min: 100000, p25: 140000, median: 150000, p75: 170000, max: 200000 };

test('large band names the range, the middle half, the median and the person, and labels the point', () => {
  render(<PayBand band={band} countryCode="IN" points={[{ value: 160000, kind: 'current' }]} />);
  expect(screen.getByRole('img')).toHaveAccessibleName(
    'Pay band: ₹1,000 to ₹2,000, middle half ₹1,400 to ₹1,700, median ₹1,500, current ₹1,600',
  );
  expect(screen.getByText('₹1,600')).toBeInTheDocument();
  expect(screen.getByText('median ₹1,500')).toBeInTheDocument();
});

test('preview band shows the current and the proposed point', () => {
  render(
    <PayBand
      size="preview"
      band={band}
      countryCode="IN"
      points={[
        { value: 160000, kind: 'current' },
        { value: 190000, kind: 'proposed' },
      ]}
    />,
  );
  expect(screen.getByRole('img')).toHaveAccessibleName(/current ₹1,600, new ₹1,900/);
  expect(screen.getByText('₹1,900')).toBeInTheDocument();
});

test('compact band has no printed labels, only the accessible summary', () => {
  render(<PayBand size="compact" band={band} countryCode="IN" />);
  expect(screen.getByRole('img')).toHaveAccessibleName(/^Pay band: /);
  expect(screen.queryByText('₹1,000')).not.toBeInTheDocument();
});
