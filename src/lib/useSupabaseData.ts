import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useClients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    void supabase
      .from('clients')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setClients(data || [])
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchClients(false)
  }, [fetchClients])

  return { clients, loading, refetch: () => fetchClients(true) }
}

export function useChantiers() {
  const [chantiers, setChantiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChantiers = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    void supabase
      .from('chantiers')
      .select('*, clients(nom)')
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setChantiers(data || [])
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchChantiers(false)
  }, [fetchChantiers])

  return { chantiers, loading, refetch: () => fetchChantiers(true) }
}

export function usePaiements() {
  const [paiements, setPaiements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPaiements = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    void supabase
      .from('paiements')
      .select('*, clients(nom), chantiers(titre)')
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setPaiements(data || [])
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchPaiements(false)
  }, [fetchPaiements])

  return { paiements, loading, refetch: () => fetchPaiements(true) }
}

export function useTaches() {
  const [taches, setTaches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTaches = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    void supabase
      .from('taches')
      .select('*, chantiers(titre, clients(nom))')
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setTaches(data || [])
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchTaches(false)
  }, [fetchTaches])

  return { taches, loading, refetch: () => fetchTaches(true) }
}

export function useDevis() {
  const [devis, setDevis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDevis = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    void supabase
      .from('devis')
      .select('*, clients(nom), chantiers(titre)')
      .order('date_emission', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setDevis(data || [])
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchDevis(false)
  }, [fetchDevis])

  return { devis, loading, refetch: () => fetchDevis(true) }
}
