import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowLeft,
  Users,
  Baby,
  UserRound,
  Filter,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QueryBot from "@/components/QueryBot";

interface Report {
  id: string;
  name: string;
  lastname: string;
  reporter_name: string;
  address: string;
  phone: string[];
  number_of_adults: number;
  number_of_children: number;
  number_of_infants: number;
  number_of_seniors: number;
  number_of_patients: number;
  health_condition: string;
  help_needed: string;
  additional_info: string;
  urgency_level: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchReports();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const searchReports = async () => {
      if (!searchTerm.trim()) {
        // No search term - show all reports with urgency filter
        let filtered = reports;
        if (urgencyFilter !== null) {
          filtered = filtered.filter((r) => r.urgency_level === urgencyFilter);
        }
        setFilteredReports(filtered);
        return;
      }

      // Perform vector-based semantic search
      setIsSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('search-reports', {
          body: { 
            query: searchTerm,
            urgencyFilter: urgencyFilter,
            limit: 100
          }
        });

        if (error) throw error;

        setFilteredReports(data.reports || []);
      } catch (err) {
        console.error('Search error:', err);
        toast.error('ไม่สามารถค้นหาได้', {
          description: 'กรุณาลองใหม่อีกครั้ง'
        });
        // Fallback to showing all reports
        let filtered = reports;
        if (urgencyFilter !== null) {
          filtered = filtered.filter((r) => r.urgency_level === urgencyFilter);
        }
        setFilteredReports(filtered);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchReports();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [reports, searchTerm, urgencyFilter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setReports(data || []);
      setFilteredReports(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyBadgeClass = (level: number) => {
    return `urgency-badge-${level}`;
  };

  const stats = {
    total: reports.length,
    children: reports.reduce((sum, r) => sum + r.number_of_children, 0),
    seniors: reports.reduce((sum, r) => sum + r.number_of_seniors, 0),
    critical: reports.filter((r) => r.urgency_level >= 4).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าแรก
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">ข้อมูลผู้ประสบภัยทั้งหมด</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">รายการทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">เด็กทั้งหมด</CardTitle>
              <Baby className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.children}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ผู้สูงอายุ</CardTitle>
              <UserRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.seniors}</div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">เร่งด่วนสูง (4-5)</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="ค้นหาอัจฉริยะ: ชื่อ, ที่อยู่, เบอร์โทร, อาการ, ความช่วยเหลือ... (ใช้ AI)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={urgencyFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUrgencyFilter(null)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  ทั้งหมด
                </Button>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant={urgencyFilter === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUrgencyFilter(level)}
                    className={urgencyFilter === level ? getUrgencyBadgeClass(level) : ""}
                  >
                    ระดับ {level}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                ไม่พบข้อมูล
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ความเร่งด่วน</TableHead>
                      <TableHead>ชื่อ-นามสกุล</TableHead>
                      <TableHead>ที่อยู่</TableHead>
                      <TableHead>เบอร์โทร</TableHead>
                      <TableHead className="text-center">ผู้ใหญ่</TableHead>
                      <TableHead className="text-center">เด็ก</TableHead>
                      <TableHead className="text-center">ทารก</TableHead>
                      <TableHead className="text-center">ผู้สูงอายุ</TableHead>
                      <TableHead className="text-center">ผู้ป่วย</TableHead>
                      <TableHead>ความช่วยเหลือ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge className={getUrgencyBadgeClass(report.urgency_level)}>
                            {report.urgency_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {report.name} {report.lastname}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{report.address}</TableCell>
                        <TableCell>
                          {report.phone.length > 0 ? report.phone.join(', ') : '-'}
                        </TableCell>
                        <TableCell className="text-center">{report.number_of_adults}</TableCell>
                        <TableCell className="text-center">{report.number_of_children}</TableCell>
                        <TableCell className="text-center">{report.number_of_infants || 0}</TableCell>
                        <TableCell className="text-center">{report.number_of_seniors}</TableCell>
                        <TableCell className="text-center">{report.number_of_patients || 0}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {report.help_needed || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <QueryBot />
    </div>
  );
};

export default Dashboard;