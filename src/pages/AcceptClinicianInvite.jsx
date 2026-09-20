import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AcceptClinicianInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || searchParams.get('token');
  const destination = token
    ? `${createPageUrl('AcceptInvite')}?t=${encodeURIComponent(token)}`
    : createPageUrl('AcceptInvite');
  return <Navigate to={destination} replace />;
}
