import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { InstitutionManagement } from '@/components/admin/InstitutionManagement';
import { CollegeManagement }     from '@/components/admin/CollegeManagement';
import { GroupManagement }       from '@/components/admin/GroupManagement';
import { Building2, GraduationCap, Users, Network, Upload } from 'lucide-react';
import { organizationService }   from '@/services/superAdminService';

export function SuperAdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const initData = async () => {
      try {
        await organizationService.initializeSampleData();
      } catch (error) {
        console.error('Error initializing sample data:', error);
      }
    };
    initData();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-balance">Super Admin Dashboard</h1>
          <p className="text-muted-foreground text-pretty">
            Manage institutions, colleges, and groups across the organization
          </p>
        </div>

        {/* Quick actions */}
        <Button onClick={() => navigate('/admin/bulk-import')}>
          <Upload className="h-4 w-4 mr-2" />
          Bulk User Import
        </Button>
      </div>

      <Tabs defaultValue="institutions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="institutions" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Institutions</span>
          </TabsTrigger>
          <TabsTrigger value="colleges" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Colleges</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">Hierarchy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions">
          <InstitutionManagement />
        </TabsContent>

        <TabsContent value="colleges">
          <CollegeManagement />
        </TabsContent>

        <TabsContent value="groups">
          <GroupManagement />
        </TabsContent>

        <TabsContent value="hierarchy">
          <div className="text-center py-12 text-muted-foreground">
            Organizational Hierarchy - Coming in next implementation
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}