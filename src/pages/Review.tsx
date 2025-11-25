import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractedData {
  name: string;
  lastname: string;
  raw_message: string;
  address: string;
  location_lat: string;
  location_long: string;
  phone: string[];
  number_of_adults: number;
  number_of_children: number;
  number_of_seniors: number;
  health_condition: string;
  help_needed: string;
  urgency_level: number;
}

const Review = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ExtractedData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    const extractedData = location.state?.extractedData;
    if (!extractedData) {
      toast.error('ไม่พบข้อมูล', { description: 'กรุณากรอกข้อมูลใหม่' });
      navigate('/');
      return;
    }
    setFormData(extractedData);
    setPhoneInput(extractedData.phone?.join(', ') || '');
  }, [location, navigate]);

  const handleSave = async () => {
    if (!formData) return;

    setIsSaving(true);

    try {
      // Parse phone numbers
      const phones = phoneInput
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const dataToSave = {
        ...formData,
        phone: phones,
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_long: formData.location_long ? parseFloat(formData.location_long) : null,
      };

      const { error } = await supabase.from('reports').insert([dataToSave]);

      if (error) {
        throw error;
      }

      toast.success('บันทึกข้อมูลสำเร็จ!', {
        description: 'ข้อมูลถูกเพิ่มเข้าระบบเรียบร้อยแล้ว'
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('ไม่สามารถบันทึกได้', {
        description: err instanceof Error ? err.message : 'กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!formData) {
    return null;
  }

  const urgencyColors = [
    'urgency-badge-1',
    'urgency-badge-2',
    'urgency-badge-3',
    'urgency-badge-4',
    'urgency-badge-5',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับไปกรอกใหม่
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">ตรวจสอบและแก้ไขข้อมูล</CardTitle>
              <Badge className={urgencyColors[formData.urgency_level - 1]}>
                เร่งด่วนระดับ {formData.urgency_level}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก คุณสามารถแก้ไขได้ทุกช่อง
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname">นามสกุล</Label>
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">ที่อยู่ *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์ (คั่นด้วยจุลภาค)</Label>
              <Input
                id="phone"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="081-234-5678, 089-999-8888"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_lat">ละติจูด</Label>
                <Input
                  id="location_lat"
                  value={formData.location_lat}
                  onChange={(e) => setFormData({ ...formData, location_lat: e.target.value })}
                  placeholder="18.7883"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_long">ลองติจูด</Label>
                <Input
                  id="location_long"
                  value={formData.location_long}
                  onChange={(e) => setFormData({ ...formData, location_long: e.target.value })}
                  placeholder="98.9853"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>จำนวนผู้ประสบภัย</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adults" className="text-sm text-muted-foreground">ผู้ใหญ่</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="0"
                    value={formData.number_of_adults}
                    onChange={(e) => setFormData({ ...formData, number_of_adults: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="children" className="text-sm text-muted-foreground">เด็ก</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={formData.number_of_children}
                    onChange={(e) => setFormData({ ...formData, number_of_children: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seniors" className="text-sm text-muted-foreground">ผู้สูงอายุ</Label>
                  <Input
                    id="seniors"
                    type="number"
                    min="0"
                    value={formData.number_of_seniors}
                    onChange={(e) => setFormData({ ...formData, number_of_seniors: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="health">ภาวะสุขภาพ</Label>
              <Textarea
                id="health"
                value={formData.health_condition}
                onChange={(e) => setFormData({ ...formData, health_condition: e.target.value })}
                rows={2}
                placeholder="ระบุภาวะสุขภาพพิเศษ เช่น ป่วย พิการ ติดเตียง"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="help">ความช่วยเหลือที่ต้องการ</Label>
              <Textarea
                id="help"
                value={formData.help_needed}
                onChange={(e) => setFormData({ ...formData, help_needed: e.target.value })}
                rows={2}
                placeholder="ระบุความช่วยเหลือที่ต้องการ เช่น เรือ อาหาร น้ำดื่ม ยา"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">ระดับความเร่งด่วน</Label>
              <select
                id="urgency"
                value={formData.urgency_level}
                onChange={(e) => setFormData({ ...formData, urgency_level: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="1">1 - ยังไม่โดนน้ำ / แจ้งเตือน</option>
                <option value="2">2 - ผู้ใหญ่ทั้งหมด น้ำท่วมชั้นล่าง</option>
                <option value="3">3 - มีเด็กหรือผู้สูงอายุ น้ำถึงชั้นสอง</option>
                <option value="4">4 - เด็กเล็กมาก หรือคนช่วยตัวเองไม่ได้</option>
                <option value="5">5 - วิกฤต: น้ำถึงหลังคา ทารก คนเจ็บ</option>
              </select>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.address}
                size="lg"
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    ยืนยันและบันทึกข้อมูล
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Review;