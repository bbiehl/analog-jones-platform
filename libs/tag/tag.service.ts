import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeTagService } from '../shared/episode-tag.service';
import { Tag, TagWithRelations } from './tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private firestore = inject(FIRESTORE);
  private episodeTagService = inject(EpisodeTagService);

  async getAllTags(): Promise<Tag[]> {
    const q = query(collection(this.firestore, 'tags'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tag);
  }

  async getTagById(id: string): Promise<Tag> {
    const snap = await getDoc(doc(this.firestore, 'tags', id));
    if (!snap.exists()) {
      throw new Error(`Tag with id "${id}" not found`);
    }
    return { id: snap.id, ...snap.data() } as Tag;
  }

  async getTagBySlug(slug: string): Promise<TagWithRelations> {
    const q = query(collection(this.firestore, 'tags'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error(`Tag with slug "${slug}" not found`);
    }

    const tagDoc = snapshot.docs[0];
    const episodes = await this.episodeTagService.getEpisodesByTagSlug(slug);
    return { id: tagDoc.id, ...tagDoc.data(), episodes } as TagWithRelations;
  }

  async createTag(tag: Omit<Tag, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'tags'), {
      name: tag.name,
      slug: tag.slug,
    });
    return docRef.id;
  }

  async updateTag(id: string, tag: Partial<Tag>): Promise<void> {
    const { id: _id, ...data } = tag as Tag;
    await updateDoc(doc(this.firestore, 'tags', id), data);
  }

  async deleteTag(id: string): Promise<void> {
    await this.episodeTagService.deleteEpisodeTagsByTagId(id);
    await deleteDoc(doc(this.firestore, 'tags', id));
  }
}
