import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, EmptyState, ErrorState } from '../../components';
import { supabase } from '../../lib/supabase';
import { Testimonial } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminTestimonialsScreen() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ 
    customer_name: '', 
    rating: 5, 
    review_text: '', 
    is_active: true 
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTestimonials(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTestimonial(null);
    setForm({ 
      customer_name: '', 
      rating: 5, 
      review_text: '', 
      is_active: true 
    });
    setModalVisible(true);
  };

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setForm({ 
      customer_name: testimonial.customer_name, 
      rating: testimonial.rating, 
      review_text: testimonial.review_text, 
      is_active: testimonial.is_active 
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    if (!form.review_text.trim()) {
      Alert.alert('Error', 'Review text is required');
      return;
    }

    try {
      setSaving(true);
      const testimonialData = {
        customer_name: form.customer_name,
        rating: form.rating,
        review_text: form.review_text,
        is_active: form.is_active,
        display_order: editingTestimonial?.display_order || 0,
      };

      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', editingTestimonial.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([testimonialData]);
        
        if (error) throw error;
      }

      setModalVisible(false);
      loadTestimonials();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Testimonial', 'Are you sure you want to delete this testimonial?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('testimonials').delete().eq('id', id);
            if (error) throw error;
            loadTestimonials();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete testimonial');
          }
        }
      },
    ]);
  };

  const toggleStatus = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_active: !currentValue })
        .eq('id', id);
      
      if (error) throw error;
      loadTestimonials();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading testimonials..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Testimonials"
        message={error}
        onRetry={loadTestimonials}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Testimonials</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {testimonials.length === 0 ? (
        <EmptyState title="No testimonials" message="Add testimonials to showcase customer feedback" />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {testimonials.map((testimonial: Testimonial) => (
            <View key={testimonial.id} style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <Text style={styles.testimonialName}>{testimonial.customer_name}</Text>
                <View style={styles.ratingContainer}>
                  {[1,2,3,4,5].map((star) => (
                    <Text
                      key={star}
                      style={[
                        styles.ratingStar,
                        testimonial.rating >= star && styles.ratingStarActive
                      ]}>
                      ★
                    </Text>
                  ))}
                  <Text style={styles.ratingText}>({testimonial.rating}/5)</Text>
                </View>
              </View>

              <Text style={styles.testimonialReview}>
                "{testimonial.review_text}"
              </Text>

              <View style={styles.testimonialActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(testimonial)}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(testimonial.id)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Customer Name"
              placeholderTextColor={COLORS.secondaryText}
              value={form.customer_name}
              onChangeText={(text) => setForm({ ...form, customer_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Review Text"
              placeholderTextColor={COLORS.secondaryText}
              value={form.review_text}
              onChangeText={(text) => setForm({ ...form, review_text: text })}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Rating (1-5 stars)</Text>
            <View style={styles.ratingOptions}>
              {[1,2,3,4,5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={[styles.ratingOption, form.rating === star && styles.ratingOptionActive]}
                  onPress={() => setForm({ ...form, rating: star })}
                >
                  <Text style={[styles.ratingOptionText, form.rating === star && styles.ratingOptionTextActive]}>
                    {star}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggle, form.is_active && styles.toggleActive]}
                onPress={() => setForm({ ...form, is_active: !form.is_active })}
              >
                <Text style={[styles.toggleText, form.is_active && styles.toggleTextActive]}>
                  Active
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Testimonial'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  headerTitle: {
    fontSize: SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  addButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: SIZES.md,
  },
  list: {
    flex: 1,
    padding: SPACING.lg,
  },
  testimonialCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    elevation: 3,
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  testimonialName: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingStar: {
    fontSize: SIZES.lg,
    color: COLORS.secondaryText,
  },
  ratingStarActive: {
    color: COLORS.gold,
  },
  ratingText: {
    fontSize: SIZES.md,
    color: COLORS.secondaryText,
    marginLeft: SPACING.sm,
  },
  testimonialReview: {
    fontSize: SIZES.md,
    color: COLORS.secondaryText,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  testimonialActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.gold,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
  deleteText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  modalTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalClose: {
    color: COLORS.gold,
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: SIZES.lg,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: SIZES.md,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  ratingOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  ratingOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondary,
  },
  ratingOptionActive: {
    backgroundColor: COLORS.gold,
  },
  ratingOptionText: {
    color: COLORS.secondaryText,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  ratingOptionTextActive: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  toggleActive: {
    backgroundColor: COLORS.gold,
  },
  toggleText: {
    color: COLORS.secondaryText,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
});