import { httpResource, HttpResourceRef } from '@angular/common/http';
import { computed, linkedSignal, signal, Signal } from '@angular/core';
import z from 'zod';

export interface SmartHttpResource<T> {
  resource: HttpResourceRef<T | undefined>;
  refetch: () => void;
  value: Signal<T | null>;
  lastValue: Signal<T | null>;
}

export interface ZodHttpResource<T> {
  resource: HttpResourceRef<T | undefined>;
  value: Signal<T | null>;
}

export function smartHttpResource<T>(
  schema: z.ZodType<T>,
  urlFn: () => string | undefined,
): SmartHttpResource<T> {
  const refetchSignal = signal(0);

  const resource = httpResource<T>(() => {
    refetchSignal();
    console.log('Fetching HTTP resource');
    return urlFn();
  });

  const value = computed<T | null>(() => {
    if (resource.hasValue()) {
      const parsed = schema.safeParse(resource.value());
      if (parsed.success) {
        return parsed.data;
      } else {
        console.error('Error parsing HTTP resource:', parsed.error);
      }
    }
    return null;
  });

  const lastValue = linkedSignal<T | null, T | null>({
    source: () => value(),
    computation: (source, prev) => {
      if (source !== null) {
        return source;
      }
      return prev?.value ?? null;
    },
  });

  const refetch = () => {
    refetchSignal.update((n) => n + 1);
  };

  return {
    resource,
    refetch,
    value,
    lastValue,
  };
}

export function zodHttpResource<T>(
  schema: z.ZodType<T>,
  urlFn: () => string | undefined,
): ZodHttpResource<T> {
  const resource = httpResource<T>(() => urlFn());

  const value = computed<T | null>(() => {
    if (resource.hasValue()) {
      const parsed = schema.safeParse(resource.value());
      if (parsed.success) {
        return parsed.data;
      } else {
        console.error('Error parsing HTTP resource:', parsed.error);
      }
    }
    return null;
  });

  return {
    resource,
    value,
  };
}
