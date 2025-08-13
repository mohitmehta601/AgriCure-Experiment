import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCropTypeOptions, getSoilTypeOptions } from "@/services/fertilizerMLService";
import { Sparkles, Leaf, Zap, Plus, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealTimeData } from "@/contexts/RealTimeDataContext";
import { useEffect } from "react";
import { farmService, type Farm, type CreateFarmData } from "@/services/farmService";

interface FormData {
  fieldName: string;
  fieldSize: string;
  sizeUnit: string;
  cropType: string;
  soilPH: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  soilType: string;
  temperature: string;
  humidity: string;
  soilMoisture: string;
}

interface EnhancedFertilizerFormProps {
  onSubmit: (data: FormData) => void;
  user?: any;
}

const EnhancedFertilizerForm = ({ onSubmit, user }: EnhancedFertilizerFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    fieldName: "",
    fieldSize: "",
    sizeUnit: "hectares",
    cropType: "",
    soilPH: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    soilType: "",
    temperature: "",
    humidity: "",
    soilMoisture: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: '',
    size: '',
    unit: 'hectares',
    cropType: '',
    soilType: '',
    location: ''
  });
  const [savingFarm, setSavingFarm] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { realTimeData, isConnected } = useRealTimeData();

  useEffect(() => {
    if (user?.id) {
      loadFarms();
    }
  }, [user]);

  const loadFarms = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await farmService.getFarmsByUser(user.id);
      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error loading farms:', error);
    }
  };

  const handleFarmSelection = (farmId: string) => {
    setSelectedFarmId(farmId);
    
    if (farmId === "new") {
      // Reset form for new farm
      setFormData({
        fieldName: "",
        fieldSize: "",
        sizeUnit: "hectares",
        cropType: "",
        soilPH: "",
        nitrogen: "",
        phosphorus: "",
        potassium: "",
        soilType: "",
        temperature: "",
        humidity: "",
        soilMoisture: ""
      });
    } else {
      // Pre-fill form with selected farm data
      const selectedFarm = farms.find(farm => farm.id === farmId);
      if (selectedFarm) {
        setFormData(prev => ({
          ...prev,
          fieldName: selectedFarm.name,
          fieldSize: selectedFarm.size.toString(),
          sizeUnit: selectedFarm.unit,
          cropType: getCropTypeOptions().find(opt => opt.label === selectedFarm.crop_type)?.value || "",
          soilType: getSoilTypeOptions().find(opt => opt.label === selectedFarm.soil_type)?.value || ""
        }));
      }
    }
  };

  const handleAddNewFarm = async () => {
    if (!user?.id) return;
    
    const sizeNum = parseFloat(newFarm.size);
    if (!newFarm.name.trim() || isNaN(sizeNum) || sizeNum <= 0 || !newFarm.cropType || !newFarm.soilType) {
      toast({
        title: t('common.error'),
        description: 'Please fill in all required fields with valid values',
        variant: "destructive"
      });
      return;
    }

    setSavingFarm(true);
    try {
      const farmData: CreateFarmData = {
        user_id: user.id,
        name: newFarm.name.trim(),
        size: sizeNum,
        unit: newFarm.unit as any,
        crop_type: newFarm.cropType,
        soil_type: newFarm.soilType,
        location: newFarm.location.trim() || undefined
      };
      
      const { data, error } = await farmService.createFarm(farmData);
      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: `Farm "${newFarm.name.trim()}" added successfully`,
      });
      
      // Reload farms and select the new one
      await loadFarms();
      if (data) {
        handleFarmSelection(data.id);
      }
      
      // Close dialog and reset form
      setIsAddFarmOpen(false);
      setNewFarm({ name: '', size: '', unit: 'hectares', cropType: '', soilType: '', location: '' });
    } catch (error) {
      console.error('Error adding farm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: t('common.error'),
        description: `Failed to add farm: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setSavingFarm(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAutoFill = () => {
    if (realTimeData) {
      setFormData(prev => ({
        ...prev,
        soilPH: realTimeData.soilPH.toString(),
        nitrogen: realTimeData.nitrogen.toString(),
        phosphorus: realTimeData.phosphorus.toString(),
        potassium: realTimeData.potassium.toString(),
        temperature: realTimeData.temperature.toString(),
        humidity: realTimeData.humidity.toString(),
        soilMoisture: realTimeData.soilMoisture.toString()
      }));
      
      toast({
        title: t('form.autoFilled'),
        description: t('form.formFilledWithSensorData'),
      });
    } else {
      toast({
        title: t('form.noDataAvailable'),
        description: t('form.realTimeSensorDataNotAvailable'),
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate processing
    setTimeout(() => {
      onSubmit(formData);
      toast({
        title: "Analysis Complete",
        description: "Your enhanced fertilizer recommendations are ready!",
      });
      setIsLoading(false);
    }, 2000);
  };

  const cropOptions = getCropTypeOptions();
  const soilOptions = getSoilTypeOptions();

  return (
    <>
    <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-2xl transition-all duration-500">
      <CardHeader className="px-4 sm:px-6 bg-gradient-to-r from-grass-50 to-green-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-grass-800">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-grass-600 animate-pulse" />
              <span>{t('dashboard.fertilizerForm')}</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-grass-700">
              Provide detailed field information for precise ML-powered fertilizer recommendations
            </CardDescription>
          </div>
                      <Button
              onClick={handleAutoFill}
              variant="outline"
              size="sm"
              disabled={!isConnected || !realTimeData}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isConnected ? t('form.autoFillWithSensorData') : t('form.sensorDataUnavailable')}
            </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Farm Selection */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-grass-50 to-green-50 rounded-lg border border-grass-200">
            <h3 className="text-base sm:text-lg font-semibold text-grass-800 flex items-center space-x-2">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600" />
              <span>Select Farm or Add New</span>
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select onValueChange={handleFarmSelection} value={selectedFarmId}>
                  <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-grass-500 focus:border-grass-500 hover:border-grass-300">
                    <SelectValue placeholder="Select an existing farm or add new" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" className="font-medium text-grass-700">
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Add New Farm</span>
                      </div>
                    </SelectItem>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id} className="hover:bg-grass-50 transition-colors duration-200">
                        <div className="flex flex-col">
                          <span className="font-medium">{farm.name}</span>
                          <span className="text-xs text-gray-500">{farm.size} {farm.unit} • {farm.crop_type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddFarmOpen(true)}
                className="bg-white hover:bg-grass-50 border-grass-300 text-grass-700 hover:text-grass-800 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Farm
              </Button>
            </div>
          </div>

          {/* Basic Field Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600" />
              <span>{t('form.fieldInfo')}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fieldName" className="text-sm sm:text-base font-medium text-gray-700">{t('form.fieldName')} *</Label>
                <Input
                  id="fieldName"
                  placeholder="e.g., North Field"
                  value={formData.fieldName}
                  onChange={(e) => handleChange("fieldName", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-grass-500 focus:border-grass-500 hover:border-grass-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="fieldSize" className="text-sm sm:text-base font-medium text-gray-700">{t('form.fieldSize')} *</Label>
                  <Input
                    id="fieldSize"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.5"
                    value={formData.fieldSize}
                    onChange={(e) => handleChange("fieldSize", e.target.value)}
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-grass-500 focus:border-grass-500 hover:border-grass-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sizeUnit" className="text-sm sm:text-base font-medium text-gray-700">Unit</Label>
                  <Select onValueChange={(value) => handleChange("sizeUnit", value)} value={formData.sizeUnit}>
                    <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-grass-500 focus:border-grass-500 hover:border-grass-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hectares">Hectares</SelectItem>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="bigha">Bigha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Crop and Soil Type */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">{t('form.cropSoilInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cropType" className="text-sm sm:text-base font-medium text-gray-700">{t('form.cropType')} *</Label>
                <Select onValueChange={(value) => handleChange("cropType", value)} value={formData.cropType}>
                  <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-grass-500 focus:border-grass-500 hover:border-grass-300">
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {cropOptions.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value} className="hover:bg-grass-50 transition-colors duration-200">
                        {crop.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="soilType" className="text-sm sm:text-base font-medium text-gray-700">{t('form.soilType')} *</Label>
                <Select onValueChange={(value) => handleChange("soilType", value)} value={formData.soilType}>
                  <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-grass-500 focus:border-grass-500 hover:border-grass-300">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    {soilOptions.map((soil) => (
                      <SelectItem key={soil.value} value={soil.value} className="hover:bg-grass-50 transition-colors duration-200">
                        {soil.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Soil Chemistry */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800">Soil Chemistry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="soilPH" className="text-sm sm:text-base font-medium text-blue-700">Soil pH *</Label>
                <Input
                  id="soilPH"
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  placeholder="e.g., 6.5"
                  value={formData.soilPH}
                  onChange={(e) => handleChange("soilPH", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nitrogen" className="text-sm sm:text-base font-medium text-blue-700">Nitrogen (mg/kg) *</Label>
                <Input
                  id="nitrogen"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 45.2"
                  value={formData.nitrogen}
                  onChange={(e) => handleChange("nitrogen", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phosphorus" className="text-sm sm:text-base font-medium text-blue-700">Phosphorus (mg/kg) *</Label>
                <Input
                  id="phosphorus"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 23.8"
                  value={formData.phosphorus}
                  onChange={(e) => handleChange("phosphorus", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="potassium" className="text-sm sm:text-base font-medium text-blue-700">Potassium (mg/kg) *</Label>
                <Input
                  id="potassium"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 156.4"
                  value={formData.potassium}
                  onChange={(e) => handleChange("potassium", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300"
                />
              </div>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <h3 className="text-base sm:text-lg font-semibold text-orange-800">{t('form.environmentalConditions')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-sm sm:text-base font-medium text-orange-700">{t('form.temperature')} (°C) *</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 24.3"
                  value={formData.temperature}
                  onChange={(e) => handleChange("temperature", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity" className="text-sm sm:text-base font-medium text-orange-700">{t('form.humidity')} (%) *</Label>
                <Input
                  id="humidity"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 72.1"
                  value={formData.humidity}
                  onChange={(e) => handleChange("humidity", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soilMoisture" className="text-sm sm:text-base font-medium text-orange-700">{t('form.soilMoisture')} (%) *</Label>
                <Input
                  id="soilMoisture"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 68.5"
                  value={formData.soilMoisture}
                  onChange={(e) => handleChange("soilMoisture", e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-grass-600 to-green-600 hover:from-grass-700 hover:to-green-700 text-sm sm:text-base py-2 sm:py-3 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('form.generating')}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>{t('form.submit')}</span>
                </div>
              )}
            </Button>
            <Button 
              type="reset" 
              variant="outline"
              className="flex-1 sm:flex-none text-sm sm:text-base py-2 sm:py-3 transition-all duration-300 hover:scale-105 border-grass-300 hover:bg-grass-50"
              onClick={() => {
                setFormData({
                  fieldName: "",
                  fieldSize: "",
                  sizeUnit: "hectares",
                  cropType: "",
                  soilPH: "",
                  nitrogen: "",
                  phosphorus: "",
                  potassium: "",
                  soilType: "",
                  temperature: "",
                  humidity: "",
                  soilMoisture: ""
                });
                setSelectedFarmId("");
              }}
            >
              {t('form.reset')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Add New Farm Dialog */}
    <Dialog open={isAddFarmOpen} onOpenChange={setIsAddFarmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-grass-600" />
            <span>Add New Farm</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Farm Name *</Label>
            <Input 
              value={newFarm.name} 
              onChange={(e) => setNewFarm(v => ({ ...v, name: e.target.value }))} 
              placeholder="e.g., North Field"
              maxLength={100}
              className="transition-all duration-300 focus:ring-2 focus:ring-grass-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Farm Size *</Label>
              <Input 
                type="number" 
                step="0.1"
                min="0.1"
                value={newFarm.size} 
                onChange={(e) => setNewFarm(v => ({ ...v, size: e.target.value }))} 
                placeholder="0.0"
                className="transition-all duration-300 focus:ring-2 focus:ring-grass-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Unit</Label>
              <Select 
                value={newFarm.unit} 
                onValueChange={(val) => setNewFarm(v => ({ ...v, unit: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hectares">Hectares</SelectItem>
                  <SelectItem value="acres">Acres</SelectItem>
                  <SelectItem value="bigha">Bigha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Crop Type *</Label>
              <Select 
                value={newFarm.cropType} 
                onValueChange={(val) => setNewFarm(v => ({ ...v, cropType: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {getCropTypeOptions().map(opt => (
                    <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Soil Type *</Label>
              <Select 
                value={newFarm.soilType} 
                onValueChange={(val) => setNewFarm(v => ({ ...v, soilType: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select soil" />
                </SelectTrigger>
                <SelectContent>
                  {getSoilTypeOptions().map(opt => (
                    <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Location (Optional)</Label>
            <Input 
              value={newFarm.location} 
              onChange={(e) => setNewFarm(v => ({ ...v, location: e.target.value }))} 
              placeholder="e.g., Village, District, State"
              maxLength={200}
              className="transition-all duration-300 focus:ring-2 focus:ring-grass-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsAddFarmOpen(false)} disabled={savingFarm}>
              Cancel
            </Button>
            <Button onClick={handleAddNewFarm} disabled={savingFarm} className="bg-grass-600 hover:bg-grass-700">
              {savingFarm ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Farm
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default EnhancedFertilizerForm;