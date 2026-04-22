export type BackendVarkProfile = 'visual' | 'aural' | 'read_write' | 'kinesthetic';
export type AxiomVarkProfile = 'visual' | 'auditory' | 'read_write' | 'kinesthetic';

export function backendToAxiomVark(profile: BackendVarkProfile | AxiomVarkProfile): AxiomVarkProfile {
  if (profile === 'aural') {
    return 'auditory';
  }

  return profile;
}

export function axiomToBackendVark(profile: AxiomVarkProfile | BackendVarkProfile): BackendVarkProfile {
  if (profile === 'auditory') {
    return 'aural';
  }

  return profile;
}
