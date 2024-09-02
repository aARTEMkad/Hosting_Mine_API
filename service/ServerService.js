import fs from "fs";
import tar from "tar-stream"

class serverService {
    

    calculateCPUUsage(cpu_stats, precpu_stats, cpus) {
        const cpuDelta = cpu_stats.cpu_usage.total_usage - precpu_stats.cpu_usage.total_usage;
        const systemDelta = cpu_stats.system_cpu_usage - precpu_stats.system_cpu_usage;
        const usageProcent = (cpuDelta / systemDelta) * cpus * 100;

        return usageProcent.toFixed(2);
    }

    convertByteInMByte(Byte) {
        return (Byte / 1024/ 1024).toFixed(2);
    }
}





export default new serverService()