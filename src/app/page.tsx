import { redirect } from 'next/navigation';

/**
 * The site root. The board is the only destination, so it sends visitors straight there.
 * @returns Never renders, because it redirects to the board.
 */
export default function HomePage() {
  redirect('/board');
}
