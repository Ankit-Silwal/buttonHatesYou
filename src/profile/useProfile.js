'use client';

import { useSyncExternalStore } from 'react';
import { subscribe, getProfile, getServerProfile } from './store';

export const useProfile = () => useSyncExternalStore(subscribe, getProfile, getServerProfile);
