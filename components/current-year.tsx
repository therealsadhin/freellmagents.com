"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getYear = () => new Date().getFullYear();

export function CurrentYear() {
  const year = useSyncExternalStore(subscribe, getYear, () => null);
  return year;
}
