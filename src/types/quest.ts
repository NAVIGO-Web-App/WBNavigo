export interface Quest {
  id: string;
  title: string;
  description: string;
  building: string;
  rewardPoints: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestFormData {
  title: string;
  description: string;
  building: string;
  rewardPoints: number;
  status: 'active' | 'inactive';
}

export interface QuestFilters {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  buildingFilter: string;
}