import { supabase } from './lib/supabase.js'

export const api = {
  async getWines(params = {}) {
    let query = supabase.from('wines').select('*')

    if (params.q) {
      query = query.or(
        `name.ilike.%${params.q}%,producer.ilike.%${params.q}%,varietal.ilike.%${params.q}%,region.ilike.%${params.q}%`
      )
    }
    if (params.country) query = query.eq('country', params.country)
    if (params.varietal) query = query.eq('varietal', params.varietal)
    if (params.min_rating) query = query.gte('rating', params.min_rating)
    if (params.max_rating) query = query.lte('rating', params.max_rating)

    const col = ['name', 'vintage', 'rating', 'created_at', 'producer'].includes(params.sort)
      ? params.sort : 'created_at'
    query = query.order(col, { ascending: params.order === 'asc' })

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
  },

  async getWine(id) {
    const { data, error } = await supabase.from('wines').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data
  },

  async createWine(wine) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('wines')
      .insert({ ...wine, user_id: user.id })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateWine(id, wine) {
    const { data, error } = await supabase
      .from('wines')
      .update(wine)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async deleteWine(id) {
    const { error } = await supabase.from('wines').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  },

  async getFilters() {
    const { data, error } = await supabase.from('wines').select('country, varietal')
    if (error) throw new Error(error.message)
    const countries = [...new Set(data.map(r => r.country).filter(Boolean))].sort()
    const varietals = [...new Set(data.map(r => r.varietal).filter(Boolean))].sort()
    return { countries, varietals }
  },

  async uploadPhoto(file) {
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('wine-labels').upload(path, file)
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('wine-labels').getPublicUrl(path)
    return { path: data.publicUrl }
  },

  async generateWineNotes(wine) {
    const res = await fetch('/api/wine-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        varietal: wine.varietal,
        region: wine.region,
        country: wine.country,
        notes: wine.notes,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to generate notes')
    return data
  },
}
