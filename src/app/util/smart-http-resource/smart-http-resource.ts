import { httpResource, HttpResourceRef } from '@angular/common/http';
import { computed, linkedSignal, signal, Signal } from '@angular/core';
import z from 'zod';

export interface SmartHttpResource<T> {
  resource: HttpResourceRef<T | undefined>;
  refetch: () => void;
  value: Signal<T | undefined>;
  lastValue: Signal<T | undefined>;
}

export interface ZodHttpResource<T> {
  resource: HttpResourceRef<T | undefined>;
  value: Signal<T | undefined>;
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

  const value = computed<T | undefined>(() => {
    if (resource.hasValue()) {
      const parsed = schema.safeParse(resource.value());
      if (parsed.success) {
        return parsed.data;
      } else {
        console.error('Error parsing HTTP resource:', parsed.error);
      }
    }
    return undefined;
  });

  const lastValue = linkedSignal<T | undefined, T | undefined>({
    source: () => value(),
    computation: (source, prev) => {
      if (source !== undefined) {
        return source;
      }
      return prev?.value ?? undefined;
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

  const value = computed<T | undefined>(() => {
    if (resource.hasValue()) {
      const parsed = schema.safeParse(resource.value());
      if (parsed.success) {
        return parsed.data;
      } else {
        console.error('Error parsing HTTP resource:', parsed.error);
      }
    }
    return undefined;
  });

  return {
    resource,
    value,
  };
}
