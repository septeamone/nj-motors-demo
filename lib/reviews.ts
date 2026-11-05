// Client reviews: videos (public/reviews) and photos (public/clients), in the order they show.
// New files go through scripts/media.mjs, which prints the numbers below (w, h, dur).
// Titles: "Name, г. City" — the part before the first comma is the name, the rest the place.

export type ReviewVideo = { id: string; title: string; sub?: string; w: number; h: number; dur: number };
// `focus`: which part of the picture the card keeps when it crops it (CSS object-position)
export type ClientPhoto = { id: string; title: string; sub?: string; alt: string; focus?: string; text?: { id: string; alt: string } };

export const VIDEOS: ReviewVideo[] = [
  { id: "review-5", title: "Ольга и Александр, г. Ванино", sub: "Chevrolet Trax 2023", w: 720, h: 1280, dur: 94 },
  { id: "review-6", title: "Юрий, г. Донецк", sub: "Hyundai Tucson", w: 848, h: 464, dur: 24 },
  { id: "review-7", title: "Илья, г. Ижевск", sub: "Hyundai Santa Fe", w: 464, h: 848, dur: 139 },
  { id: "review-2", title: "Александр, г. Ванино", sub: "Chevrolet Trailblazer 2026", w: 720, h: 1280, dur: 102 },
  { id: "review-3", title: "Дмитрий, г. Санкт-Петербург", sub: "Hyundai Tucson 2020", w: 1280, h: 720, dur: 30 },
  { id: "review-8", title: "Игорь, г. Ижевск", sub: "Hyundai Tucson", w: 464, h: 848, dur: 21 },
  { id: "review-9", title: "Илья, г. Ижевск", sub: "Chevrolet Equinox", w: 352, h: 640, dur: 51 },
  { id: "review-10", title: "Ольга и Юрий, г. Ижевск", sub: "BMW X1 2021", w: 464, h: 848, dur: 19 },
  { id: "review-4", title: "Григорий и Андрей, г. Ижевск", sub: "Land Rover Discovery Sport, SsangYong", w: 720, h: 1280, dur: 98 },
  { id: "review-1", title: "Евгений, г. Красноярск", sub: "Chevrolet Trailblazer 2022", w: 720, h: 1280, dur: 82 },
];

// `text`: the client's written review (a screenshot), shown as the second page of the same card
export const PHOTOS: ClientPhoto[] = [
  { id: "client-darya", title: "Дарья, г. Глазов", sub: "Kia Sportage 2021", alt: "Дарья у белой Kia Sportage" },
  { id: "client-sergey", title: "Сергей, г. Ижевск", sub: "BMW X1 2021", alt: "Сергей у чёрного BMW X1" },
  {
    id: "client-stanislav",
    title: "Станислав, г. Ижевск",
    sub: "Kia K5",
    alt: "Белая Kia K5 на парковке",
    text: { id: "client-stanislav-text", alt: "Отзыв Станислава: машина приехала строго вовремя, Андрей был на связи и контролировал каждый этап, рекомендует" },
  },
  { id: "client-elena", title: "Елена, Алтайский край", sub: "Kia Sportage 2022", focus: "50% 80%", alt: "Отзыв Елены с фото белой Kia Sportage: благодарит Андрея, рекомендует" },
];

/** "Ольга и Александр, г. Ванино" → ["Ольга и Александр", "г. Ванино"] */
export const splitTitle = (t: string) => {
  const k = t.indexOf(", ");
  return k < 0 ? [t, ""] : [t.slice(0, k), t.slice(k + 2)];
};

export const clock = (s: number) => {
  const r = Math.round(s);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
};
