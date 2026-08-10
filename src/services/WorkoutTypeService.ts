import type { WorkoutTypeDef } from '../types';
import { StorageService } from './StorageService';

export class WorkoutTypeService {
  public static readonly BUILT_IN_TYPES: WorkoutTypeDef[] = [
    { icon: '🏃', name: 'Бег', color: '#ff6b6b' },
    { icon: '🏋️', name: 'Силовая', color: '#ff9f43' },
    { icon: '🏊', name: 'Плавание', color: '#54a0ff' },
    { icon: '🚴', name: 'Вело', color: '#5f27cd' },
    { icon: '🧘', name: 'Растяжка', color: '#a29bfe' },
    { icon: '🥊', name: 'Единоборства', color: '#e056a0' },
    { icon: '🎾', name: 'Игровые', color: '#ffd700' },
    { icon: '🏔️', name: 'Поход', color: '#00b894' },
    { icon: '💪', name: 'Фитнес', color: '#e17055' },
    { icon: '⚽', name: 'Футбол', color: '#74b9ff' },
    { icon: '🏀', name: 'Баскетбол', color: '#fd9644' },
    { icon: '📋', name: 'Другое', color: '#b2bec3' },
  ];

  public static loadCustomTypes(): WorkoutTypeDef[] {
    return StorageService.loadCustomWorkoutTypes();
  }

  public static saveCustomTypes(types: WorkoutTypeDef[]): void {
    StorageService.saveCustomWorkoutTypes(types);
  }

  public static getAllTypes(customTypes?: WorkoutTypeDef[]): WorkoutTypeDef[] {
    const custom = customTypes || WorkoutTypeService.loadCustomTypes();
    return [...WorkoutTypeService.BUILT_IN_TYPES, ...custom];
  }

  public static getTypeIcon(typeName: string, customTypes?: WorkoutTypeDef[]): string {
    const found = WorkoutTypeService.getAllTypes(customTypes).find(t => t.name === typeName);
    return found ? found.icon : '🏋️';
  }

  public static getTypeColor(typeName: string, customTypes?: WorkoutTypeDef[]): string {
    const found = WorkoutTypeService.getAllTypes(customTypes).find(t => t.name === typeName);
    return found ? found.color : '#ffffff';
  }

  public static addCustomType(customTypes: WorkoutTypeDef[], newType: WorkoutTypeDef): WorkoutTypeDef[] {
    if (!newType.name.trim()) return customTypes;
    const exists = WorkoutTypeService.getAllTypes(customTypes).some(
      t => t.name.toLowerCase() === newType.name.trim().toLowerCase()
    );
    if (exists) return customTypes;
    const updated = [...customTypes, { ...newType, name: newType.name.trim() }];
    WorkoutTypeService.saveCustomTypes(updated);
    return updated;
  }

  public static deleteCustomType(customTypes: WorkoutTypeDef[], nameToDelete: string): WorkoutTypeDef[] {
    const updated = customTypes.filter(t => t.name !== nameToDelete);
    WorkoutTypeService.saveCustomTypes(updated);
    return updated;
  }

  public static updateCustomType(
    customTypes: WorkoutTypeDef[],
    oldName: string,
    updates: Partial<WorkoutTypeDef>
  ): WorkoutTypeDef[] {
    const updated = customTypes.map(t => t.name === oldName ? { ...t, ...updates } : t);
    WorkoutTypeService.saveCustomTypes(updated);
    return updated;
  }
}
