import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QueryResult {
  summary: string;
  count: number;
  reports: Array<{
    id: string;
    name: string;
    lastname: string;
    address: string;
    urgency_level: number;
    help_needed: string;
  }>;
}

const QueryBot = () => {
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  const handleQuery = async () => {
    if (!query.trim()) {
      toast.error('กรุณาระบุคำถาม');
      return;
    }

    setIsQuerying(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('query-reports', {
        body: { query: query.trim() }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      console.error('Query error:', err);
      toast.error('ไม่สามารถค้นหาได้', {
        description: err instanceof Error ? err.message : 'กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  const getUrgencyBadgeClass = (level: number) => {
    return `urgency-badge-${level}`;
  };

  return (
    <Card className="shadow-lg border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <span>Query Bot</span>
          <Badge variant="outline" className="text-xs">AI-Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder='ถามอะไรก็ได้ เช่น "มีเด็กต่ำกว่า 1 ขวบกี่เคส" หรือ "พื้นที่ใดต้องการเรือด่วน"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isQuerying}
            className="flex-1"
          />
          <Button onClick={handleQuery} disabled={isQuerying || !query.trim()}>
            {isQuerying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-accent/10 rounded-lg">
              <p className="text-sm font-medium mb-2">คำตอบ:</p>
              <p className="text-foreground">{result.summary}</p>
              <p className="text-sm text-muted-foreground mt-2">
                พบข้อมูลทั้งหมด {result.count} รายการ
              </p>
            </div>

            {result.reports.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">รายการที่เกี่ยวข้อง:</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.reports.map((report) => (
                    <Card key={report.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">
                              {report.name} {report.lastname}
                            </p>
                            <Badge className={getUrgencyBadgeClass(report.urgency_level)}>
                              {report.urgency_level}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {report.address}
                          </p>
                          {report.help_needed && (
                            <p className="text-sm text-primary mt-1">
                              ต้องการ: {report.help_needed}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryBot;