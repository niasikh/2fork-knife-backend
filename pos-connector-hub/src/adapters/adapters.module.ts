import { Module } from '@nestjs/common';
import { SyrveAdapter } from './syrve/syrve.adapter';
// Import other adapters as they're implemented:
// import { MicrosAdapter } from './micros/micros.adapter';
// import { FinaAdapter } from './fina/fina.adapter';
// import { SuhhraAdapter } from './suphra/suphra.adapter';

@Module({
  providers: [
    SyrveAdapter,
    // MicrosAdapter,
    // FinaAdapter,
    // SuhhraAdapter,
  ],
  exports: [
    SyrveAdapter,
  ],
})
export class AdaptersModule {}

